import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IHttpService, HttpService, GET, Criteria, DefaultHeaders, RequestCriteriaOuput, Path, Query } from '@cartesianui/platform-core';
import { Permission } from '../../models';

@Injectable()
@DefaultHeaders({
  Accept: 'application/json',
  'Content-Type': 'application/json'
})
export class PermissionHttpService extends HttpService implements IHttpService<Permission> {

  @GET('/permissions')
  public getAll(@Criteria criteria: RequestCriteriaOuput): Observable<any> {
    return null;
  }

  @GET('/permissions/{id}')
  public getById(@Path('id') id: string, @Query('include') includes?: string): Observable<any> {
    return null;
  }

  public create(body: Permission): Observable<any> {
    throw new Error('Permissions are read-only');
  }

  public update(id: string, body: Partial<Permission>): Observable<any> {
    throw new Error('Permissions are read-only');
  }

  public delete(id: string): Observable<any> {
    throw new Error('Permissions are read-only');
  }
}
